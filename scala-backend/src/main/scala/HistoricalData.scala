import scala.beans.BeanProperty
import com.google.cloud.Timestamp

case class HistoricalData(@BeanProperty var prices: java.util.Map[String, String],
                          @BeanProperty var updatedAt: Timestamp) {
  def this() = this(new java.util.HashMap(), null)
}