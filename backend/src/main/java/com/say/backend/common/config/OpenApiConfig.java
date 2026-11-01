package com.say.backend.common.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI sayOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("Say App API Documentation")
                        .description("REST API documentation for Say App - Aesthetic Music Notes & Social Discovery Platform.")
                        .version("v1.0.0")
                        .contact(new Contact().name("Say Development Team"))
                        .license(new License().name("Apache 2.0")));
    }
}
