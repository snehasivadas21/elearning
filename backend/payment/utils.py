from .models import CoursePurchase

def can_access_course(user, course):
    if course.is_free:
        return True
    return CoursePurchase.objects.filter(student=user, course=course, is_paid=True).exists()