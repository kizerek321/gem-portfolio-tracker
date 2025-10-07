ThisBuild / version := "0.1.0-SNAPSHOT"
ThisBuild / scalaVersion := "3.3.3"

// Project details
lazy val root = (project in file("."))
  .settings(
    name := "scala-backend",
    libraryDependencies ++= Seq(
      // The core sttp library for making HTTP requests
      "com.softwaremill.sttp.client3" %% "core" % "3.9.7",

      // sttp integration with the circe JSON library
      "com.softwaremill.sttp.client3" %% "circe" % "3.9.7",

      // The main circe libraries for parsing JSON
      // --- VERSIONS CORRECTED HERE ---
      "io.circe" %% "circe-core"    % "0.14.15",
      "io.circe" %% "circe-generic" % "0.14.15",
      "io.circe" %% "circe-parser"  % "0.14.15",

      // firebase admin sdk
      "com.google.firebase" % "firebase-admin" % "9.3.0"
    )
  )