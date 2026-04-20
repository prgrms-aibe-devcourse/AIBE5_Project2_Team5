package com.example.pixel_project2;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

@EnableJpaAuditing //Base time entity 생성일 수정일 공통 시간 값 자동 삽입
@SpringBootApplication
public class PixelProject2Application {

    public static void main(String[] args) {
        SpringApplication.run(PixelProject2Application.class, args);
    }

}
