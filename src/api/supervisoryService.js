// src/api/supervisoryService.js
import apiClient from './client';

// Fetch shifts (filtered by site for Supervisors, or site-wide for Executives)
export const fetchSupervisoryShifts = async (siteFilter = null) => {
  try {
    const params = siteFilter ? { site: siteFilter } : {};
    const response = await apiClient.get('/supervisory/shifts', { params });
    return response.data.shifts || [];
  } catch (error) {
    console.error('Failed to fetch supervisory shifts:', error?.response?.data || error.message);
    throw error;
  }
};

// Post supervisory or executive comment & toggle payroll clearance
export const submitShiftComment = async (shiftId, commentText, payrollApproved = true) => {
  try {
    const response = await apiClient.post(`/supervisory/shifts/${shiftId}/comment`, {
      comment: commentText,
      payrollApproved
    });
    return response.data.shift;
  } catch (error) {
    console.error('Failed to submit comment:', error?.response?.data || error.message);
    throw error;
  }
};