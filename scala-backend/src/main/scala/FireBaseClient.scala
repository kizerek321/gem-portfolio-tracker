import com.google.auth.oauth2.GoogleCredentials
import com.google.cloud.firestore.Firestore
import com.google.firebase.cloud.FirestoreClient
import com.google.firebase.{FirebaseApp, FirebaseOptions}

import java.io.FileInputStream

object FireBaseClient {

  println("Initializing Firebase Admin SDK...")
  try {
    val serviceAccount = new FileInputStream("serviceAccountKey.json")
    val options = FirebaseOptions.builder()
      .setCredentials(GoogleCredentials.fromStream(serviceAccount))
      .build()
    FirebaseApp.initializeApp(options)
    println("Firebase initialized successfully.")
  } catch {
    case e: Exception =>
      println(s"CRITICAL: Failed to initialize Firebase. Make sure 'serviceAccountKey.json' is in the project root.")
      println(e.getMessage)
      System.exit(1) // Exit if we can't connect to Firebase
  }

  val db: Firestore = FirestoreClient.getFirestore()
}