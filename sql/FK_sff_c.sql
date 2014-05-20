ALTER TABLE searchFormField ADD CONSTRAINT FK_sff_c
FOREIGN KEY (characteristic_id) REFERENCES characteristic(id)
ON DELETE CASCADE;