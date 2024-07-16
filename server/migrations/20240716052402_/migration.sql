/*
  Warnings:

  - You are about to alter the column `create_time` on the `sys_upload` table. The data in that column could be lost. The data in that column will be cast from `DateTime(0)` to `DateTime`.

*/
-- AlterTable
ALTER TABLE `sys_upload` MODIFY `create_time` DATETIME NOT NULL DEFAULT NOW(),
    MODIFY `update_time` TIMESTAMP(0) NOT NULL DEFAULT NOW() ON UPDATE NOW();

-- AlterTable
ALTER TABLE `sys_user` MODIFY `password` VARCHAR(255) NULL DEFAULT '';
