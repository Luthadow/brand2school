import { findSchoolByNameAndDistrict } from "../schools/registerSchool.js";
import { getParticipationSchoolById } from "./listParticipationSchoolOptions.js";

export type ParticipationSchoolLookup = {
  schoolId?: string;
  schoolName?: string;
  district?: string;
};

export async function resolveParticipationSchool(input: ParticipationSchoolLookup) {
  if (input.schoolId) {
    return getParticipationSchoolById(input.schoolId);
  }
  if (input.schoolName && input.district) {
    return findSchoolByNameAndDistrict(input.schoolName, input.district);
  }
  return null;
}
