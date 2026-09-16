-- Backfill doctors created before doctor signup started creating directory records.
DO $$
DECLARE
    legacy_doctor RECORD;
    directory_id TEXT;
BEGIN
    FOR legacy_doctor IN
        SELECT
            u.id AS user_id,
            COALESCE(p.id::text, '') AS profile_id,
            COALESCE(p.display_name, u.name, 'Doctor') AS display_name,
            COALESCE(p.specialization, 'General Physician') AS specialization,
            COALESCE(p.qualification, 'Medical professional') AS qualification,
            COALESCE(p.experience_years, 0) AS experience_years,
            COALESCE(p.consultation_fee, 0) AS consultation_fee,
            COALESCE(p.city, 'Online') AS city,
            COALESCE(p.state, 'India') AS state,
            COALESCE(p.bio, 'Doctor available for health consultations through Niraksh Guardian.') AS bio,
            COALESCE(p.contact_info, u.email) AS contact_info,
            p.phone,
            p.license_number,
            p.clinic_name,
            p.clinic_address,
            p.consultation_modes
        FROM "users" u
        LEFT JOIN "doctor_profiles" p ON p."user_id" = u.id
        LEFT JOIN "doctors" d ON d.id = p."directory_doctor_id"
        WHERE u.role = 'DOCTOR' AND d.id IS NULL
    LOOP
        directory_id := gen_random_uuid()::text;

        INSERT INTO "doctors" (
            id, name, specialization, qualification, experience_years, consultation_fee,
            rating, city, state, bio, contact_info, phone, image_url, tags, is_available,
            created_at, updated_at
        ) VALUES (
            directory_id,
            legacy_doctor.display_name,
            legacy_doctor.specialization,
            legacy_doctor.qualification,
            legacy_doctor.experience_years,
            legacy_doctor.consultation_fee,
            0,
            legacy_doctor.city,
            legacy_doctor.state,
            legacy_doctor.bio,
            legacy_doctor.contact_info,
            legacy_doctor.phone,
            NULL,
            ARRAY[legacy_doctor.specialization],
            true,
            CURRENT_TIMESTAMP,
            CURRENT_TIMESTAMP
        );

        IF legacy_doctor.profile_id <> '' THEN
            UPDATE "doctor_profiles"
            SET "directory_doctor_id" = directory_id,
                "verification_status" = 'APPROVED',
                "consultation_modes" = CASE
                    WHEN COALESCE(cardinality("consultation_modes"), 0) = 0
                    THEN ARRAY['IN_PERSON']::"ConsultationMode"[]
                    ELSE "consultation_modes"
                END,
                "updated_at" = CURRENT_TIMESTAMP
            WHERE id = legacy_doctor.profile_id;
        ELSE
            INSERT INTO "doctor_profiles" (
                id, user_id, directory_doctor_id, license_number, verification_status,
                display_name, specialization, qualification, experience_years, consultation_fee,
                city, state, bio, contact_info, phone, clinic_name, clinic_address,
                consultation_modes, created_at, updated_at
            ) VALUES (
                gen_random_uuid()::text,
                legacy_doctor.user_id,
                directory_id,
                legacy_doctor.license_number,
                'APPROVED',
                legacy_doctor.display_name,
                legacy_doctor.specialization,
                legacy_doctor.qualification,
                legacy_doctor.experience_years,
                legacy_doctor.consultation_fee,
                legacy_doctor.city,
                legacy_doctor.state,
                legacy_doctor.bio,
                legacy_doctor.contact_info,
                legacy_doctor.phone,
                legacy_doctor.clinic_name,
                legacy_doctor.clinic_address,
                CASE
                    WHEN COALESCE(cardinality(legacy_doctor.consultation_modes), 0) = 0
                    THEN ARRAY['IN_PERSON']::"ConsultationMode"[]
                    ELSE legacy_doctor.consultation_modes
                END,
                CURRENT_TIMESTAMP,
                CURRENT_TIMESTAMP
            );
        END IF;
    END LOOP;
END $$;
