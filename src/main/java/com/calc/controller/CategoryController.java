package com.calc.controller;

import com.calc.dto.dtos.*;
import com.calc.security.SecurityUtil;
import com.calc.service.CategoryService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/categories")
public class CategoryController {

    private final CategoryService categoryService;
    private final SecurityUtil securityUtil;

    public CategoryController(CategoryService categoryService, SecurityUtil securityUtil) {
        this.categoryService = categoryService;
        this.securityUtil = securityUtil;
    }

    @GetMapping
    public ResponseEntity<List<CategoryResponse>> getAll(Authentication auth) {
        return ResponseEntity.ok(categoryService.getUserCategories(securityUtil.getCurrentUserId(auth)));
    }

    @PostMapping
    public ResponseEntity<CategoryResponse> create(@RequestBody CategoryRequest request, Authentication auth) {
        return ResponseEntity.ok(categoryService.createCategory(securityUtil.getCurrentUserId(auth), request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<CategoryResponse> update(@PathVariable Long id,
                                                    @RequestBody CategoryRequest request,
                                                    Authentication auth) {
        return ResponseEntity.ok(categoryService.updateCategory(id, securityUtil.getCurrentUserId(auth), request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id, Authentication auth) {
        categoryService.deleteCategory(id, securityUtil.getCurrentUserId(auth));
        return ResponseEntity.noContent().build();
    }
}
