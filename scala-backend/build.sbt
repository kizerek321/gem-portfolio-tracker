import com.typesafe.sbt.packager.docker.DockerChmodType
import com.typesafe.sbt.packager.docker.DockerPlugin
import com.typesafe.sbt.packager.docker.DockerPlugin.autoImport.{Docker, dockerBaseImage, dockerChmodType, dockerUpdateLatest}
import com.typesafe.sbt.packager.archetypes.JavaAppPackaging

ThisBuild / version := "0.1.0-SNAPSHOT"
ThisBuild / scalaVersion := "3.3.3"

lazy val root = (project in file("."))
  .settings(
    name := "scala-backend",
    mainClass := Some("Main"),
    libraryDependencies ++= Seq(
      // The core sttp library for making HTTP requests
      "com.softwaremill.sttp.client3" %% "core" % "3.9.7",

      // sttp integration with the circe JSON library
      "com.softwaremill.sttp.client3" %% "circe" % "3.9.7",

      // The main circe libraries for parsing JSON
      "io.circe" %% "circe-core"    % "0.14.15",
      "io.circe" %% "circe-generic" % "0.14.15",
      "io.circe" %% "circe-parser"  % "0.14.15",

      "com.google.firebase" % "firebase-admin" % "9.3.0"
    )
  )
  .enablePlugins(JavaAppPackaging, DockerPlugin)
  .settings(
    // Docker settings
    Docker / packageName := "scala-backend-container",
    Docker / version     := "latest",
    dockerBaseImage      := "eclipse-temurin:17-jre-alpine", // A small, secure base image
    dockerChmodType      := DockerChmodType.UserGroupWriteExecute,
    dockerUpdateLatest   := true
  )