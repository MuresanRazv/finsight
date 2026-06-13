# Stage 1: Build the application
FROM maven:3.9.6-eclipse-temurin-21 AS builder
WORKDIR /app

# Copy pom.xml first so dependency layer is cached independently of source changes
COPY pom.xml .

# Download dependencies into a persistent BuildKit cache mount.
# This layer is reused across builds as long as pom.xml hasn't changed.
RUN --mount=type=cache,target=/root/.m2 \
    mvn dependency:go-offline -q

# Copy source and build — only re-runs when src/ changes
COPY src ./src
RUN --mount=type=cache,target=/root/.m2 \
    mvn clean package -DskipTests -q

# Stage 2: Run the application (minimal JRE image)
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
COPY --from=builder /app/target/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]