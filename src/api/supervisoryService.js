// src/api/supervisoryService.js
import apiClient from './client';

// Fetch shifts (filtered by site/timeframe for Supervisors or Executives)
export const fetchSupervisoryShifts = async (siteFilter = null, timeframe = 'all') => {
  try {
    const params = {};
    if (siteFilter) params.site = siteFilter;
    if (timeframe) params.timeframe = timeframe;

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
    const response = await apiClient.post(`/supervisory/shift-comment/${shiftId}`, {
      comment: commentText,
      payrollApproved
    });
    return response.data.shift;
  } catch (error) {
    console.error('Failed to submit shift comment:', error?.response?.data || error.message);
    throw error;
  }
};