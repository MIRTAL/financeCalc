package com.calc.service;

import com.calc.dto.dtos.*;
import com.calc.entity.Category;
import com.calc.entity.User;
import com.calc.repository.CategoryRepository;
import com.calc.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class CategoryService {

    private final CategoryRepository categoryRepository;
    private final UserRepository userRepository;

    public CategoryService(CategoryRepository categoryRepository, UserRepository userRepository) {
        this.categoryRepository = categoryRepository;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public List<CategoryResponse> getUserCategories(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return categoryRepository.findByUserOrderByTypeAscNameAsc(user).stream()
                .map(this::toResponse).toList();
    }

    @Transactional
    public CategoryResponse createCategory(Long userId, CategoryRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        Category category = new Category();
        category.setUser(user);
        category.setName(request.name());
        category.setType(request.type());
        category.setIcon(request.icon());
        category.setColor(request.color());
        category = categoryRepository.save(category);
        return toResponse(category);
    }

    @Transactional
    public CategoryResponse updateCategory(Long id, Long userId, CategoryRequest request) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Category not found"));
        if (!category.getUser().getId().equals(userId)) {
            throw new RuntimeException("Access denied");
        }
        category.setName(request.name());
        category.setType(request.type());
        category.setIcon(request.icon());
        category.setColor(request.color());
        category = categoryRepository.save(category);
        return toResponse(category);
    }

    @Transactional
    public void deleteCategory(Long id, Long userId) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Category not found"));
        if (!category.getUser().getId().equals(userId)) {
            throw new RuntimeException("Access denied");
        }
        categoryRepository.delete(category);
    }

    private CategoryResponse toResponse(Category c) {
        return new CategoryResponse(c.getId(), c.getName(), c.getType(),
                c.getIcon(), c.getColor(), c.getCreatedAt());
    }
}
