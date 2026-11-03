-- DropIndex
DROP INDEX `participantes_sorteo_id_telefono_key` ON `participantes`;

-- AlterTable
ALTER TABLE `participantes` DROP COLUMN `consentimiento`,
    DROP COLUMN `telefono`;

-- CreateIndex
CREATE UNIQUE INDEX `participantes_sorteo_id_nombre_key` ON `participantes`(`sorteo_id`, `nombre`);
