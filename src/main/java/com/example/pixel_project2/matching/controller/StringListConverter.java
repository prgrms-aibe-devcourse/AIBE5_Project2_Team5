package com.example.pixel_project2.matching.controller;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

import java.util.ArrayList;
import java.util.List;

@Converter
public class StringListConverter implements AttributeConverter<List<String>, String> {

    private final ObjectMapper mapper = new ObjectMapper();

    // 1. 자바(List) -> DB(String)로 저장할 때
    @Override
    public String convertToDatabaseColumn(List<String> dataList) {
        if (dataList == null || dataList.isEmpty()) {
            return null; // 데이터가 없으면 null 저장
        }
        try {
            // List를 JSON 형태의 String으로 변환
            return mapper.writeValueAsString(dataList);
        } catch (JsonProcessingException e) {
            throw new RuntimeException("List를 JSON 문자열로 변환하는 데 실패했습니다.", e);
        }
    }

    // 2. DB(String) -> 자바(List)로 읽어올 때
    @Override
    public List<String> convertToEntityAttribute(String data) {
        if (data == null || data.trim().isEmpty()) {
            return new ArrayList<>(); // 데이터가 없으면 빈 리스트 반환
        }
        try {
            // JSON 형태의 String을 다시 List로 복구
            return mapper.readValue(data, new TypeReference<List<String>>() {});
        } catch (JsonProcessingException e) {
            throw new RuntimeException("JSON 문자열을 List로 변환하는 데 실패했습니다.", e);
        }
    }
}
