package com.calc.repository;

import com.calc.entity.Category;
import com.calc.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface CategoryRepository extends JpaRepository<Category, Long> {
    List<Category> findByUserOrderByTypeAscNameAsc(User user);
    List<Category> findByUserId(UUID userId);
}
