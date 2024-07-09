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
