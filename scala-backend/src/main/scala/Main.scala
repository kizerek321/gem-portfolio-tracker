import com.google.cloud.Timestamp

import java.io.FileInputStream
import java.util.Properties
import scala.jdk.CollectionConverters.*
import scala.util.Using

object Main {

  // --- Configuration Loading ---
  val properties = new Properties()
  val configPath = "config.properties"
  val apiKey: String = try {
    val configFile = new FileInputStream(configPath)
    properties.load(configFile)
    val key = properties.getProperty("alphavantage.apikey")
    if (key == null || key.trim.isEmpty || key == "YOUR_API_KEY_HERE") {
      throw new RuntimeException(s"API key 'alphavantage.apikey' is missing or not set in $configPath")
    }
    println("API key loaded successfully.")
    key
  } catch {
    case e: Exception =>
      println(s"CRITICAL: Could not load API key from '$configPath'. Please ensure the file exists and contains a valid 'alphavantage.apikey'.")
      println(e.getMessage)
      System.exit(1)
      ""
  }

  // --- Application Setup ---
  val ticker = "VT"
  val daysToKeep = 280 // Approximately 13 months of trading days
  val db = FireBaseClient.db // Get the initialized DB instance
  val historyDocRef = db.collection("historicalData").document(ticker)
  val signalDocRef = db.collection("public").document("gemSignal")
  val fetcher = new dataFetcher(apiKey, ticker)

  // --- Business Logic ---

  def runDailyUpdate(): Unit = {
    fetcher.fetchCompactHistory() match {
      case Left(error) => println(s"Daily update failed: $error")
      case Right(apiData) =>
        val latestApiEntry = apiData.`Time Series (Daily)`.toSeq.sortBy(_._1).last
        val (latestDate, _) = latestApiEntry
        val latestPrice = latestApiEntry._2.`4. close`
        println(s"Fetched latest price for $latestDate: $$${latestPrice}")

        val existingDataDoc = historyDocRef.get().get()
        if (!existingDataDoc.exists()) {
          println("ERROR: No historical data found. Please run the backfill first using 'sbt \"run backfill\"'.")
          return
        }
        val historicalData = existingDataDoc.toObject(classOf[HistoricalData])
        if (historicalData == null || historicalData.prices == null) {
          println("ERROR: Document is malformed or has no 'prices' field.")
          return
        }
        val existingPrices = historicalData.prices.asScala.toMap
        val updatedPrices = (existingPrices + (latestDate -> latestPrice)).toSeq.sortBy(_._1).reverse.take(daysToKeep).toMap
        val sortedPrices = updatedPrices.toSeq.sortBy(_._1)
        val (_, priceTodayStr) = sortedPrices.last
        val (pastDate, price12MonthsAgoStr) = sortedPrices.head
        val priceToday = priceTodayStr.toDouble
        val price12MonthsAgo = price12MonthsAgoStr.toDouble
        val momentumReturn = priceToday / price12MonthsAgo - 1
        val signal = if (momentumReturn > 0) "VT" else "BND"
        println(s"Calculated 12M return: ${"%.2f".format(momentumReturn * 100)}%. Signal: $signal")

        val signalData = Map(
          "signal" -> signal,
          "calculationDate" -> latestDate,
          "return_12m" -> momentumReturn.toString,
          "current_price" -> priceTodayStr,
          "past_price_date" -> pastDate,
          "past_price" -> price12MonthsAgoStr,
          "updatedAt" -> Timestamp.now()
        )
        signalDocRef.set(signalData.asJava).get()
        println(s"Successfully wrote signal to Firestore.")

        val historyDataToSave = Map(
          "prices" -> updatedPrices.asJava,
          "updatedAt" -> Timestamp.now()
        )
        historyDocRef.set(historyDataToSave.asJava).get()
        println("Successfully updated historical data.")
    }
  }

  def runBackFill(): Unit = {
    fetcher.fetchFullHistory() match {
      case Left(error) => println(s"Backfill failed: $error")
      case Right(data) =>
        println("Successfully fetched full history")
        val allPrices = data.`Time Series (Daily)`.view.mapValues(_.`4. close`).toMap
        val recentPrices = allPrices.toSeq.sortBy(_._1).reverse.take(daysToKeep).toMap

        val dataToSave = Map(
          "prices" -> recentPrices.asJava,
          "updatedAt" -> Timestamp.now()
        )
        historyDocRef.set(dataToSave.asJava).get()
        println(s"successfully backfilled ${recentPrices.size} days of data to firestore")
    }
  }

  @main
  def run(args: String*): Unit = {
    if (args.contains("backfill")) {
      println("Running backfill...")
      runBackFill()
    } else {
      println("Running daily update...")
      runDailyUpdate()
    }
  }
}