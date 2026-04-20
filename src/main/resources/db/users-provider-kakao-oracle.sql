BEGIN
    FOR constraint_row IN (
        SELECT uc.constraint_name
        FROM user_constraints uc
        JOIN user_cons_columns ucc
          ON uc.constraint_name = ucc.constraint_name
         AND uc.table_name = ucc.table_name
        WHERE uc.table_name = 'USERS'
          AND uc.constraint_type = 'C'
          AND ucc.column_name = 'PROVIDER'
    ) LOOP
        EXECUTE IMMEDIATE 'ALTER TABLE USERS DROP CONSTRAINT ' || constraint_row.constraint_name;
    END LOOP;
END;
/

ALTER TABLE USERS
ADD CONSTRAINT CK_USERS_PROVIDER
CHECK (PROVIDER IN ('LOCAL', 'GOOGLE', 'KAKAO'));
