from instrpanel.models import Notification

def notify_course_students(course, title, message, notif_type="live_session"):
    students = course.purchases.values_list("student", flat=True)

    notifications = [
        Notification(
            user_id=student_id,
            title=title,
            message=message,
            notification_type=notif_type,
        )
        for student_id in students
    ]

    Notification.objects.bulk_create(notifications)
