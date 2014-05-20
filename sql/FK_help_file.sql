ALTER TABLE helptopic ADD CONSTRAINT FK_help_file
FOREIGN KEY (image_id) REFERENCES fileupload(id);