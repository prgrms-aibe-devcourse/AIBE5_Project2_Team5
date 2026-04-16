package com.example.pixel_project2.portfolio.service;

import com.example.pixel_project2.portfolio.dto.PortfolioPolicyResponse;
import org.springframework.stereotype.Service;

@Service
public class PortfolioServiceImpl implements PortfolioService {
    @Override
    public PortfolioPolicyResponse getPortfolioPolicy() {
        return new PortfolioPolicyResponse(true, true, true);
    }
}
