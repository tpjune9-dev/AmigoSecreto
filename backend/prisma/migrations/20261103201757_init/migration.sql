-- CreateTable
CREATE TABLE `administradores` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nombre` VARCHAR(120) NOT NULL,
    `email` VARCHAR(160) NOT NULL,
    `password_hash` VARCHAR(255) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `administradores_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sorteos` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `administrador_id` INTEGER NOT NULL,
    `nombre` VARCHAR(150) NOT NULL,
    `codigo_unico` VARCHAR(20) NOT NULL,
    `descripcion` TEXT NULL,
    `fecha_evento` DATETIME(3) NOT NULL,
    `presupuesto` DECIMAL(10, 2) NULL,
    `estado` ENUM('INSCRIPCIONES_ABIERTAS', 'INSCRIPCIONES_CERRADAS', 'SORTEO_REALIZADO') NOT NULL DEFAULT 'INSCRIPCIONES_ABIERTAS',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `sorteos_codigo_unico_key`(`codigo_unico`),
    INDEX `sorteos_administrador_id_idx`(`administrador_id`),
    INDEX `sorteos_codigo_unico_idx`(`codigo_unico`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `participantes` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `sorteo_id` INTEGER NOT NULL,
    `nombre` VARCHAR(120) NOT NULL,
    `telefono` VARCHAR(30) NOT NULL,
    `pin_hash` VARCHAR(255) NOT NULL,
    `consentimiento` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `participantes_sorteo_id_idx`(`sorteo_id`),
    UNIQUE INDEX `participantes_sorteo_id_telefono_key`(`sorteo_id`, `telefono`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `asignaciones` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `sorteo_id` INTEGER NOT NULL,
    `participante_origen_id` INTEGER NOT NULL,
    `participante_destino_id` INTEGER NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `asignaciones_sorteo_id_idx`(`sorteo_id`),
    UNIQUE INDEX `asignaciones_sorteo_id_participante_origen_id_key`(`sorteo_id`, `participante_origen_id`),
    UNIQUE INDEX `asignaciones_sorteo_id_participante_destino_id_key`(`sorteo_id`, `participante_destino_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `sorteos` ADD CONSTRAINT `sorteos_administrador_id_fkey` FOREIGN KEY (`administrador_id`) REFERENCES `administradores`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `participantes` ADD CONSTRAINT `participantes_sorteo_id_fkey` FOREIGN KEY (`sorteo_id`) REFERENCES `sorteos`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `asignaciones` ADD CONSTRAINT `asignaciones_sorteo_id_fkey` FOREIGN KEY (`sorteo_id`) REFERENCES `sorteos`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `asignaciones` ADD CONSTRAINT `asignaciones_participante_origen_id_fkey` FOREIGN KEY (`participante_origen_id`) REFERENCES `participantes`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `asignaciones` ADD CONSTRAINT `asignaciones_participante_destino_id_fkey` FOREIGN KEY (`participante_destino_id`) REFERENCES `participantes`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
