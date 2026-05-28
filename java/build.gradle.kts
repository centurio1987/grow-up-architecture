plugins {
    application
    java
}

java {
    toolchain {
        languageVersion.set(JavaLanguageVersion.of(21))
    }
}

repositories {
    mavenCentral()
}

dependencies {
    testImplementation("org.junit.jupiter:junit-jupiter:5.10.2")
}

application {
    // -PmainClass=patterns.Singleton 으로 덮어쓸 수 있다.
    val cls = (project.findProperty("mainClass") as String?) ?: "patterns.Singleton"
    mainClass.set(cls)
}

tasks.test {
    useJUnitPlatform()
}

tasks.named<JavaExec>("run") {
    standardInput = System.`in`
}
