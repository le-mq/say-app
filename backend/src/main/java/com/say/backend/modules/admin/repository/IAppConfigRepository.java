package com.say.backend.modules.admin.repository;

import com.say.backend.modules.admin.entity.AppConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface IAppConfigRepository extends JpaRepository<AppConfig, String> {
}
