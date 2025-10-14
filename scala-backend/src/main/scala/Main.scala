import com.google.cloud.Timestamp
import com.google.cloud.firestore.SetOptions
import java.io.FileInputStream
import java.time.LocalDate
import java.time.format.DateTimeFormatter
import java.util.Properties
import scala.jdk.CollectionConverters._

object Main {

  // --- Configuration Loading ---
  val properties = new Properties()
  val configPath = "config.properties"
  val apiKey: String = try {
    val configFile = new FileInputStream(configPath)
    properties.load(configFile)
    val key = properties.getProperty("alphavantage.apikey")
    if (key == null || key.trim.isEmpty) {
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
  val assets = List("CBU0.L", "CNDX.L", "EIMI.L", "IB01.L", "IWDA.L", "SMH.L")
  val daysToKeep = 280 // Approximately 13 months of trading days
  val db = FireBaseClient.db // Get the initialized DB instance

  // --- Business Logic ---

  def runDailyUpdate(): Unit = {
    println("Running daily update for all assets...")
    for (ticker <- assets) {
      println(s"--- Processing $ticker ---")
      val signalDocRef = db.collection("public").document(ticker)
      val fetcher = new dataFetcher(apiKey, ticker)

      fetcher.fetchCompactHistory() match {
        case Left(error) => println(s"Daily update for $ticker failed: $error")
        case Right(apiData) =>
          if (apiData.`Time Series (Daily)`.isEmpty) {
            println(s"No daily data found for $ticker.")
          } else {
            val latestApiEntry = apiData.`Time Series (Daily)`.toSeq.sortBy(_._1).last
            val (latestDate, _) = latestApiEntry
            val latestPrice = latestApiEntry._2.`4. close`
            println(s"Fetched latest price for $latestDate: $$${latestPrice}")

            val date = LocalDate.parse(latestDate, DateTimeFormatter.ISO_LOCAL_DATE)
            val latestYear = date.getYear.toString
            val latestMonth = f"${date.getMonthValue}%02d"

            val monthDocRef = db.collection("historicalData").document(ticker)
              .collection("years").document(latestYear)
              .collection("months").document(latestMonth)

            val docSnapshot = monthDocRef.get().get()

            if (!docSnapshot.exists()) {
              // --- DOCUMENT DOES NOT EXIST: CREATE IT ---
              // Create the document for the first time this month.
              val newMonthData = Map(
                "prices" -> Map(latestDate -> latestPrice).asJava,
                "updatedAt" -> Timestamp.now()
              ).asJava
              monthDocRef.set(newMonthData).get()
              println(s"Successfully created new price document for $ticker for $latestYear-$latestMonth.")
            }else{
              val updateData: Map[String, Any] = Map(
                s"prices.$latestDate" -> latestPrice.toDouble, // e.g., "prices.2025-10-14"
                "updatedAt" -> Timestamp.now()
              )
              monthDocRef.update(updateData.asJava).get()
              println(s"Successfully updated price for $ticker on $latestDate.")
            }
            // Fetch the last ~14 months of data to ensure we have enough for the momentum calculation
            var allPrices: Map[String, String] = Map.empty
            for (i <- 0 to 13) {
              val d = date.minusMonths(i)
              val year = d.getYear.toString
              val month = f"${d.getMonthValue}%02d"
              val docRef = db.collection("historicalData").document(ticker)
                .collection("years").document(year)
                .collection("months").document(month)
              val doc = docRef.get().get()
              if (doc.exists()) {
                val data = doc.toObject(classOf[HistoricalData])
                if (data != null && data.prices != null) {
                  allPrices = allPrices ++ data.prices.asScala
                }
              }
            }

            val recentPrices = allPrices.toSeq.sortBy(_._1).reverse.take(daysToKeep).toMap

            if (recentPrices.size >= 2) {
              val sortedPrices = recentPrices.toSeq.sortBy(_._1)
              val (_, priceTodayStr) = sortedPrices.last
              val (pastDate, price12MonthsAgoStr) = sortedPrices.head
              val priceToday = priceTodayStr.toDouble
              val price12MonthsAgo = price12MonthsAgoStr.toDouble
              val momentumReturn = priceToday / price12MonthsAgo - 1
              val signal = ticker
              println(s"Calculated 12M return for $ticker: ${"%.2f".format(momentumReturn * 100)}%. Signal: $signal")

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
              println(s"Successfully wrote signal for $ticker to Firestore.")
            } else {
              println(s"Not enough historical data to calculate momentum for $ticker. Need at least 2 data points in the last $daysToKeep days.")
            }
          }
      }
    }
  }

  def runBackFill(): Unit = {
    println("Running backfill for all assets...")
    for (ticker <- assets) {
      println(s"--- Processing $ticker ---")
      val fetcher = new dataFetcher(apiKey, ticker)

      fetcher.fetchFullHistory() match {
        case Left(error) => println(s"Backfill for $ticker failed: $error")
        case Right(data) =>
          if (data.`Time Series (Daily)`.isEmpty) {
            println(s"No full history data found for $ticker.")
          } else {
            println(s"Successfully fetched full history for $ticker")
            val allPrices = data.`Time Series (Daily)`.view.mapValues(_.`4. close`).toMap
            val pricesByYearMonth = allPrices.groupBy { case (date, _) =>
              val year = date.substring(0, 4)
              val month = date.substring(5, 7)
              (year, month)
            }

            println(s"Found data for ${pricesByYearMonth.size} year/month combinations for $ticker.")

            for (((year, month), prices) <- pricesByYearMonth) {
              val monthDocRef = db.collection("historicalData").document(ticker)
                .collection("years").document(year)
                .collection("months").document(month)

              val dataToSave = Map("prices" -> prices.asJava, "updatedAt" -> Timestamp.now())
              monthDocRef.set(dataToSave.asJava).get()
              println(s"Successfully backfilled ${prices.size} days of data for $ticker for $year-$month.")
            }
          }
      }
    }
  }

  def test(): Unit ={
    println("Running test for CBU0.L...")
    val ticker = "CBU0.L"
    val year = "2025"
    val month = "01"

    val testPrices = Map(
      "2025-01-01" -> "150.00",
      "2025-01-02" -> "151.25",
      "2025-01-03" -> "150.75",
      "2025-01-04" -> "152.10"
    )
    val monthDocRef = db.collection("historicalData").document(ticker)
      .collection("years").document(year)
      .collection("months").document(month)

    val dataToSave = Map("prices" -> testPrices.asJava, "updatedAt" -> Timestamp.now())
    monthDocRef.set(dataToSave.asJava).get()

    println(s"Successfully wrote ${testPrices.size} sample data points for $ticker for $year-$month.")
  }

  def test_signal(): Unit={
    println("Running Firestore update test...")
    val ticker = "CBU0.L"
    val testYear = "2025"
    val testMonth = "01"

    // 1. Seed initial data for a specific month
    println(s"--- Seeding initial data for $ticker for $testYear-$testMonth ---")
    val monthDocRef = db.collection("historicalData").document(ticker)
      .collection("years").document(testYear)
      .collection("months").document(testMonth)

    // 1. Simulate a daily update to add a new price to the same month
    println(s"--- Simulating daily update for a new price on 2025-10-03 ---")
    val newDate = "2025-01-05"
    val newPrice = "102.75"

    // 2.This logic mimics runDailyUpdate, using `update` for an existing doc
    val updateData: Map[String, Any] = Map(
      s"prices.$newDate" -> newPrice,
      "updatedAt" -> Timestamp.now()
    )
    monthDocRef.update(updateData.asJava).get()
    println(s"Successfully updated price for $ticker on $newDate using 'update'.")

    // 3. Verify the final data
    println("--- Verifying final data ---")
    val finalDoc = monthDocRef.get().get()
    if (finalDoc.exists()) {
      val data = finalDoc.toObject(classOf[HistoricalData])
      if (data != null && data.prices != null) {
        val finalPrices = data.prices.asScala
        println(s"Final prices for $testYear-$testMonth: $finalPrices")
        if (finalPrices.contains(newDate) && finalPrices.contains("2025-01-05")) {
          println("Verification successful: New price was added and old prices were preserved.")
        } else {
          println("Verification FAILED: Data was overwritten or not added correctly.")
        }
      } else {
        println("Verification FAILED: Document format is incorrect after update.")
      }
    } else {
      println("Verification FAILED: Document does not exist after update.")
    }
  }

  @main
  def run(args: String*): Unit = {
    if (args.contains("backfill")) {
      println("Running backfill...")
      runBackFill()
    }else if (args.contains("test_history")){
      test()
    } else if (args.contains("test_daily")) {
      test_signal()
    }else {
      println("Running daily update...")
      runDailyUpdate()
    }
  }
}
