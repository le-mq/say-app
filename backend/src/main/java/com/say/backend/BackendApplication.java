package com.say.backend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

import java.io.File;
import java.nio.file.Files;
import java.util.List;

@SpringBootApplication
@EnableAsync
public class BackendApplication {

    public static void main(String[] args) {
        loadDotEnv();
        SpringApplication.run(BackendApplication.class, args);
    }

    private static void loadDotEnv() {
        String[] possiblePaths = {
            ".env",
            "backend/.env",
            "../.env",
            "../backend/.env"
        };
        File envFile = null;
        for (String path : possiblePaths) {
            File f = new File(path);
            if (f.exists() && f.isFile()) {
                envFile = f;
                break;
            }
        }
        if (envFile != null) {
            try {
                List<String> lines = Files.readAllLines(envFile.toPath());
                for (String line : lines) {
                    String trimmed = line.trim();
                    if (!trimmed.isEmpty() && !trimmed.startsWith("#") && trimmed.contains("=")) {
                        String[] parts = trimmed.split("=", 2);
                        String key = parts[0].trim();
                        String val = parts[1].trim();
                        if ((val.startsWith("\"") && val.endsWith("\"")) || (val.startsWith("'") && val.endsWith("'"))) {
                            val = val.substring(1, val.length() - 1);
                        }
                        if (System.getProperty(key) == null && System.getenv(key) == null) {
                            System.setProperty(key, val);
                        }
                    }
                }
            } catch (Exception ignored) {
            }
        }
    }
}
