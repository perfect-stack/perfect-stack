import { SetMetadata } from '@nestjs/common';

/**
 * This defines where the "Subject Key" is. Where to find the name of the subject.
 */
export const SUBJECT_KEY = 'SUBJECT_KEY';
export const SubjectKey = (subjectKey) => SetMetadata(SUBJECT_KEY, subjectKey);
