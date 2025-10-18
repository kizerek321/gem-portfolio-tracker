import com.typesafe.sbt.packager.docker.DockerChmodType
import com.typesafe.sbt.packager.docker.DockerPlugin
import com.typesafe.sbt.packager.docker.DockerPlugin.autoImport.{Docker, dockerBaseImage, dockerChmodType, dockerUpdateLatest}
import com.typesafe.sbt.packager.archetypes.JavaAppPackaging
import scala.collection.Seq

ThisBuild / version := "0.1.0-SNAPSHOT"
ThisBuild / scalaVersion := "3.3.3"

lazy val root = (project in file("."))
  .enablePlugins(JavaAppPackaging, DockerPlugin)
  .settings(
    name := "scala-backend",
    Compile / mainClass := Some("Main"),
    libraryDependencies ++= Seq(
      // The core sttp library for making HTTP requests
      "com.softwaremill.sttp.client3" %% "core" % "3.9.7",

      // sttp integration with the circe JSON library
      "com.softwaremill.sttp.client3" %% "circe" % "3.9.7",

      // The main circe libraries for parsing JSON
      "io.circe" %% "circe-core"    % "0.14.15",
      "io.circe" %% "circe-generic" % "0.14.15",
      "io.circe" %% "circe-parser"  % "0.14.15",

      "com.google.firebase" % "firebase-admin" % "9.3.0",
      "com.google.cloud" % "google-cloud-secretmanager" % "2.40.0"
    ),

    bashScriptDefines += "shebang=#!/bin/sh",
    // Docker settings
    publish / skip := true,
    Docker / dockerRepository := Some("europe-central2-docker.pkg.dev/gem-portfolio-tracker/my-app-repo"),
    Docker / packageName := "scala-backend",
    Docker / version     := "latest",
    dockerBaseImage      := "eclipse-temurin:17-jre",
    dockerChmodType      := DockerChmodType.UserGroupWriteExecute,
    dockerUpdateLatest   := true
  )