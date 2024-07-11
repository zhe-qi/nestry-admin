-- CreateTable
CREATE TABLE `sys_upload` (
    `upload_id` CHAR(64) NOT NULL,
    `size` INTEGER UNSIGNED NULL,
    `file_name` VARCHAR(100) NULL,
    `new_file_name` VARCHAR(100) NULL,
    `url` VARCHAR(500) NULL,
    `ext` VARCHAR(50) NULL,
    `status` CHAR(1) NULL DEFAULT '0',
    `create_time` DATETIME NOT NULL DEFAULT NOW(),
    `update_time` TIMESTAMP(0) NOT NULL DEFAULT NOW() ON UPDATE NOW(),

    PRIMARY KEY (`upload_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `gen_table` (
    `table_id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `table_name` VARCHAR(200) NULL DEFAULT '',
    `table_comment` VARCHAR(500) NULL DEFAULT '',
    `sub_table_name` VARCHAR(64) NULL,
    `sub_table_fk_name` VARCHAR(64) NULL,
    `class_name` VARCHAR(100) NULL DEFAULT '',
    `tpl_category` VARCHAR(200) NULL DEFAULT 'crud',
    `tpl_web_type` VARCHAR(30) NULL DEFAULT '',
    `package_name` VARCHAR(100) NULL,
    `module_name` VARCHAR(30) NULL,
    `business_name` VARCHAR(30) NULL,
    `function_name` VARCHAR(50) NULL,
    `function_author` VARCHAR(50) NULL,
    `gen_type` CHAR(1) NULL DEFAULT '0',
    `gen_path` VARCHAR(200) NULL DEFAULT '/',
    `options` VARCHAR(1000) NULL,
    `create_by` VARCHAR(64) NULL DEFAULT '',
    `create_time` VARCHAR(25) NULL,
    `update_by` VARCHAR(64) NULL DEFAULT '',
    `update_time` VARCHAR(25) NULL,
    `remark` VARCHAR(500) NULL,

    PRIMARY KEY (`table_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `gen_table_column` (
    `column_id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `table_id` INTEGER UNSIGNED NULL,
    `column_name` VARCHAR(200) NULL,
    `column_comment` VARCHAR(500) NULL,
    `column_type` VARCHAR(100) NULL,
    `java_type` VARCHAR(500) NULL,
    `java_field` VARCHAR(200) NULL,
    `is_pk` CHAR(1) NULL,
    `is_increment` CHAR(1) NULL,
    `is_required` CHAR(1) NULL,
    `is_insert` CHAR(1) NULL,
    `is_edit` CHAR(1) NULL,
    `is_list` CHAR(1) NULL,
    `is_query` CHAR(1) NULL,
    `query_type` VARCHAR(200) NULL DEFAULT 'EQ',
    `html_type` VARCHAR(200) NULL,
    `dict_type` VARCHAR(200) NULL DEFAULT '',
    `sort` INTEGER NULL,
    `create_by` VARCHAR(64) NULL DEFAULT '',
    `create_time` VARCHAR(25) NULL,
    `update_by` VARCHAR(64) NULL DEFAULT '',
    `update_time` VARCHAR(25) NULL,

    INDEX `gen_table_column_table_id_idx`(`table_id`),
    PRIMARY KEY (`column_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sys_config` (
    `config_id` INTEGER NOT NULL AUTO_INCREMENT,
    `config_name` VARCHAR(100) NULL DEFAULT '',
    `config_key` VARCHAR(100) NULL DEFAULT '',
    `config_value` VARCHAR(500) NULL DEFAULT '',
    `config_type` CHAR(1) NULL DEFAULT 'N',
    `create_by` VARCHAR(64) NULL DEFAULT '',
    `create_time` VARCHAR(25) NULL,
    `update_by` VARCHAR(64) NULL DEFAULT '',
    `update_time` VARCHAR(25) NULL,
    `remark` VARCHAR(500) NULL,

    PRIMARY KEY (`config_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sys_dept` (
    `dept_id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `parent_id` INTEGER UNSIGNED NULL DEFAULT 0,
    `ancestors` VARCHAR(50) NULL DEFAULT '',
    `dept_name` VARCHAR(30) NULL DEFAULT '',
    `order_num` INTEGER NULL DEFAULT 0,
    `leader` VARCHAR(20) NULL,
    `phone` VARCHAR(11) NULL,
    `email` VARCHAR(50) NULL,
    `status` CHAR(1) NULL DEFAULT '1',
    `create_by` VARCHAR(64) NULL DEFAULT '',
    `create_time` VARCHAR(25) NULL,
    `update_by` VARCHAR(64) NULL DEFAULT '',
    `update_time` VARCHAR(25) NULL,

    PRIMARY KEY (`dept_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sys_dict_data` (
    `dict_code` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `dict_sort` INTEGER NULL DEFAULT 0,
    `dict_label` VARCHAR(100) NULL DEFAULT '',
    `dict_value` VARCHAR(100) NULL DEFAULT '',
    `dict_type` VARCHAR(100) NULL DEFAULT '',
    `css_class` VARCHAR(100) NULL,
    `list_class` VARCHAR(100) NULL,
    `is_default` CHAR(1) NULL DEFAULT 'N',
    `status` CHAR(1) NULL DEFAULT '1',
    `create_by` VARCHAR(64) NULL DEFAULT '',
    `create_time` VARCHAR(25) NULL,
    `update_by` VARCHAR(64) NULL DEFAULT '',
    `update_time` VARCHAR(25) NULL,
    `remark` VARCHAR(500) NULL,

    INDEX `sys_dict_data_dict_type_idx`(`dict_type`),
    PRIMARY KEY (`dict_code`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sys_dict_type` (
    `dict_id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `dict_name` VARCHAR(100) NULL DEFAULT '',
    `dict_type` VARCHAR(100) NULL DEFAULT '',
    `status` CHAR(1) NULL DEFAULT '1',
    `create_by` VARCHAR(64) NULL DEFAULT '',
    `create_time` VARCHAR(25) NULL,
    `update_by` VARCHAR(64) NULL DEFAULT '',
    `update_time` VARCHAR(25) NULL,
    `remark` VARCHAR(500) NULL,

    UNIQUE INDEX `dict_type`(`dict_type`),
    PRIMARY KEY (`dict_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sys_logininfor` (
    `info_id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `user_name` VARCHAR(50) NULL DEFAULT '',
    `ipaddr` VARCHAR(128) NULL DEFAULT '',
    `login_location` VARCHAR(255) NULL DEFAULT '',
    `browser` VARCHAR(50) NULL DEFAULT '',
    `os` VARCHAR(50) NULL DEFAULT '',
    `status` CHAR(1) NULL DEFAULT '1',
    `msg` VARCHAR(255) NULL DEFAULT '',
    `login_time` VARCHAR(25) NULL,

    INDEX `idx_sys_logininfor_lt`(`login_time`),
    INDEX `idx_sys_logininfor_s`(`status`),
    PRIMARY KEY (`info_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sys_menu` (
    `menu_id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `menu_name` VARCHAR(50) NOT NULL,
    `parent_id` INTEGER UNSIGNED NULL DEFAULT 0,
    `order_num` INTEGER NULL DEFAULT 0,
    `path` VARCHAR(200) NULL DEFAULT '',
    `component` VARCHAR(255) NULL,
    `query` VARCHAR(255) NULL,
    `is_frame` INTEGER NULL DEFAULT 0,
    `is_cache` INTEGER NULL DEFAULT 1,
    `menu_type` CHAR(1) NULL DEFAULT '',
    `visible` CHAR(1) NULL DEFAULT '1',
    `status` CHAR(1) NULL DEFAULT '1',
    `perms` VARCHAR(100) NULL,
    `icon` VARCHAR(100) NULL DEFAULT '#',
    `create_by` VARCHAR(64) NULL DEFAULT '',
    `create_time` VARCHAR(25) NULL,
    `update_by` VARCHAR(64) NULL DEFAULT '',
    `update_time` VARCHAR(25) NULL,
    `remark` VARCHAR(500) NULL DEFAULT '',

    PRIMARY KEY (`menu_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sys_notice` (
    `notice_id` INTEGER NOT NULL AUTO_INCREMENT,
    `notice_title` VARCHAR(50) NOT NULL,
    `notice_type` CHAR(1) NOT NULL,
    `notice_content` MEDIUMTEXT NULL,
    `status` CHAR(1) NULL DEFAULT '1',
    `create_by` VARCHAR(64) NULL DEFAULT '',
    `create_time` VARCHAR(25) NULL,
    `update_by` VARCHAR(64) NULL DEFAULT '',
    `update_time` VARCHAR(25) NULL,
    `remark` VARCHAR(255) NULL,

    PRIMARY KEY (`notice_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sys_post` (
    `post_id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `post_code` VARCHAR(64) NOT NULL,
    `post_name` VARCHAR(50) NOT NULL,
    `post_sort` INTEGER NOT NULL,
    `status` CHAR(1) NOT NULL DEFAULT '1',
    `create_by` VARCHAR(64) NULL DEFAULT '',
    `create_time` VARCHAR(25) NULL,
    `update_by` VARCHAR(64) NULL DEFAULT '',
    `update_time` VARCHAR(25) NULL,
    `remark` VARCHAR(500) NULL,

    PRIMARY KEY (`post_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sys_user_post` (
    `user_id` INTEGER UNSIGNED NOT NULL,
    `post_id` INTEGER UNSIGNED NOT NULL,

    INDEX `sys_user_post_post_id_idx`(`post_id`),
    PRIMARY KEY (`user_id`, `post_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sys_role_dept` (
    `role_id` INTEGER UNSIGNED NOT NULL,
    `dept_id` INTEGER UNSIGNED NOT NULL,

    INDEX `sys_role_dept_dept_id_idx`(`dept_id`),
    PRIMARY KEY (`role_id`, `dept_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sys_role_menu` (
    `role_id` INTEGER UNSIGNED NOT NULL,
    `menu_id` INTEGER UNSIGNED NOT NULL,

    INDEX `sys_role_menu_menu_id_idx`(`menu_id`),
    PRIMARY KEY (`role_id`, `menu_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sys_user` (
    `user_id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `dept_id` INTEGER UNSIGNED NULL,
    `user_name` VARCHAR(30) NOT NULL,
    `nick_name` VARCHAR(30) NOT NULL,
    `user_type` VARCHAR(2) NULL DEFAULT '00',
    `email` VARCHAR(50) NULL DEFAULT '',
    `phonenumber` VARCHAR(11) NULL DEFAULT '',
    `sex` CHAR(1) NULL DEFAULT '0',
    `avatar` VARCHAR(100) NULL DEFAULT '',
    `password` VARCHAR(100) NULL DEFAULT '',
    `status` CHAR(1) NULL DEFAULT '1',
    `login_ip` VARCHAR(128) NULL DEFAULT '',
    `login_date` VARCHAR(25) NULL,
    `create_by` VARCHAR(64) NULL DEFAULT '',
    `create_time` VARCHAR(25) NULL,
    `update_by` VARCHAR(64) NULL DEFAULT '',
    `update_time` VARCHAR(25) NULL,
    `remark` VARCHAR(500) NULL,

    INDEX `sys_user_dept_id_idx`(`dept_id`),
    PRIMARY KEY (`user_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sys_role` (
    `role_id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `role_name` VARCHAR(30) NOT NULL,
    `role_key` VARCHAR(100) NOT NULL,
    `role_sort` INTEGER NOT NULL,
    `data_scope` CHAR(1) NULL DEFAULT '5',
    `menu_check_strictly` TINYINT NULL DEFAULT 1,
    `dept_check_strictly` TINYINT NULL DEFAULT 1,
    `status` CHAR(1) NOT NULL DEFAULT '1',
    `create_by` VARCHAR(64) NULL DEFAULT '',
    `create_time` VARCHAR(25) NULL,
    `update_by` VARCHAR(64) NULL DEFAULT '',
    `update_time` VARCHAR(25) NULL,
    `remark` VARCHAR(500) NULL,

    PRIMARY KEY (`role_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sys_user_role` (
    `user_id` INTEGER UNSIGNED NOT NULL,
    `role_id` INTEGER UNSIGNED NOT NULL,

    INDEX `sys_user_role_role_id_idx`(`role_id`),
    PRIMARY KEY (`user_id`, `role_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sys_job` (
    `job_id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `job_name` VARCHAR(64) NOT NULL DEFAULT '',
    `job_group` VARCHAR(64) NOT NULL DEFAULT 'DEFAULT',
    `invoke_target` VARCHAR(500) NOT NULL,
    `cron_expression` VARCHAR(255) NOT NULL DEFAULT '',
    `misfire_policy` VARCHAR(20) NOT NULL DEFAULT '3',
    `concurrent` CHAR(1) NOT NULL DEFAULT '1',
    `status` CHAR(1) NOT NULL DEFAULT '0',
    `create_by` VARCHAR(64) NULL DEFAULT '',
    `create_time` VARCHAR(25) NOT NULL,
    `update_by` VARCHAR(64) NULL DEFAULT '',
    `update_time` VARCHAR(25) NULL,
    `remark` VARCHAR(500) NULL DEFAULT '',

    PRIMARY KEY (`job_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sys_job_log` (
    `job_log_id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `job_name` VARCHAR(64) NOT NULL,
    `job_group` VARCHAR(64) NOT NULL,
    `invoke_target` VARCHAR(500) NOT NULL,
    `job_message` VARCHAR(500) NULL,
    `status` CHAR(1) NOT NULL DEFAULT '0',
    `exception_info` VARCHAR(2000) NULL DEFAULT '',
    `create_time` VARCHAR(25) NOT NULL,

    PRIMARY KEY (`job_log_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
