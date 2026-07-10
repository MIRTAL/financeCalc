package com.calc.config;

import com.calc.service.RecurringOperationService;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;

@Configuration
@EnableScheduling
public class SchedulerConfig {

    private final RecurringOperationService recurringService;

    public SchedulerConfig(RecurringOperationService recurringService) {
        this.recurringService = recurringService;
    }

    @Scheduled(cron = "0 0 6 * * *")
    public void processRecurringOperations() {
        recurringService.processDueOperations();
    }
}
