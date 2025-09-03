import { SetMetadata } from '@nestjs/common';

/**
 * The subject can be defined as a constant value. This is takes precedence over the SUBJECT_KEY.
 */
export const SUBJECT_NAME = 'SUBJECT_NAME';
export const SubjectName = (subjectName) =>
  SetMetadata(SUBJECT_NAME, subjectName);

/**
 * This defines where the "Subject Key" is. Where to find the name of the subject.
 */
export const SUBJECT_KEY = 'SUBJECT_KEY';
export const SubjectKey = (subjectKey) => SetMetadata(SUBJECT_KEY, subjectKey);
