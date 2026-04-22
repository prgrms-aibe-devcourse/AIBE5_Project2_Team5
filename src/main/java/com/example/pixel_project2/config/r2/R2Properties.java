package com.example.pixel_project2.config.r2;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Getter
@Setter
@Component
@ConfigurationProperties(prefix = "app.r2")
public class R2Properties {
    private String accountId;
    private String endpoint;
    private String accessKeyId;
    private String secretAccessKey;
    private String bucketName;
    private String publicUrl;
}
