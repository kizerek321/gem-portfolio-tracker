import com.google.auth.oauth2.GoogleCredentials
import com.google.cloud.firestore.Firestore
import com.google.firebase.cloud.FirestoreClient
import com.google.firebase.{FirebaseApp, FirebaseOptions}
import com.google.cloud.secretmanager.v1.{SecretManagerServiceClient, SecretVersionName}
import java.io.ByteArrayInputStream
import java.io.FileInputStream

object FireBaseClient {
  
  private def getSecret(secretId: String, versionId: String = "latest"): String = {
    val projectId = "gem-portfolio-tracker"
    val client = SecretManagerServiceClient.create()
    val secretVersionName = SecretVersionName.of(projectId, secretId, versionId)
    val response = client.accessSecretVersion(secretVersionName)
    client.close()
    response.getPayload.getData.toStringUtf8
  }
  println("Initializing Firebase Admin SDK...")
  try {
    val serviceAccountPath = "C:\\Users\\kizer\\Documents\\app\\scala-backend\\firebasekey.json"
    val file = new java.io.File(serviceAccountPath)

    val serviceAccountStream = if (file.exists()) {
      println(s"Loading service account key from local file: $serviceAccountPath")
      new FileInputStream(file)
    } else {
      val serviceAccount = getSecret("accountKey")
      new ByteArrayInputStream(serviceAccount.getBytes)
    }

    val options = FirebaseOptions.builder()
      .setCredentials(GoogleCredentials.fromStream(serviceAccountStream))
      .build()
    FirebaseApp.initializeApp(options)
    println("Firebase initialized successfully.")
  } catch {
    case e: Exception =>
      println(s"CRITICAL: Failed to initialize Firebase. Make sure 'serviceAccountKey.json' is in the project root.")
      println(e.getMessage)
      System.exit(1) 
  }

  val db: Firestore = FirestoreClient.getFirestore()
}