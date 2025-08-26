import axiosInstance from "./axiosInstance"

export const completeLesson = async(lessonId)=>{
    return axiosInstance.post(`/lesson/${lessonId}/complete/`);
}

export const getCourseProgress = async(courseId)=>{
    return axiosInstance.get(`/courses/${courseId}/progress`);
}

