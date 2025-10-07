case class TimeSeriesData(
                           `1. open`: String,
                           `2. high`: String,
                           `3. low`: String,
                           `4. close`: String,
                           `5. volume`: String
                         )

case class AlphaVantageResponse(
                                 `Time Series (Daily)`: Map[String, TimeSeriesData]
                               )
