# Simple logger to file

## Abilities:
- Writes data in txt-file with name **TemplateYYYYMMDDHHmmss.txt**
- Allows to set maximum file size (if after data was written file size becomes more than given maximum, creates new file with new timestamp)
- Data writes async by packs but strongly in order it was given to logger
- Every line in file starts with timestamp of the logger get this data to save
- Allows to set mode of logging to filter messages with inappropriate importance level

## GitHub
https://github.com/stalker8610/logger