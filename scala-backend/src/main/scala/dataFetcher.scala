import sttp.client3.*
import sttp.client3.circe.*
import io.circe.generic.auto.*

class dataFetcher(apiKey: String, ticker: String) {

  private val backend = HttpClientSyncBackend()

  def fetchFullHistory(): Either[ResponseException[String, io.circe.Error], AlphaVantageResponse] = {
    val fullHistoryUri = uri"https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=$ticker&outputsize=full&apikey=$apiKey"
    val request = basicRequest.get(fullHistoryUri).response(asJson[AlphaVantageResponse])
    val response = request.send(backend)
    response.body
  }

  def fetchCompactHistory(): Either[ResponseException[String, io.circe.Error], AlphaVantageResponse] = {
    val compactUri = uri"https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=$ticker&outputsize=compact&apikey=$apiKey"
    val request = basicRequest.get(compactUri).response(asJson[AlphaVantageResponse])
    val response = request.send(backend)
    response.body
  }
}