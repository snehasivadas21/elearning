from rest_framework import serializers
from .models import Choice,Question,Quiz,QuizSubmission,AnswerSubmission

class ChoiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Choice
        fields = ['id', 'text','question','is_correct']


class QuestionSerializer(serializers.ModelSerializer):
    choices = ChoiceSerializer(many=True, read_only=True)

    class Meta:
        model = Question
        fields = ['id', 'quiz', 'text', 'order', 'choices']


class QuizSerializer(serializers.ModelSerializer):
    questions = QuestionSerializer(many=True, read_only=True)

    class Meta:
        model = Quiz
        fields = ['id', 'module', 'title', 'is_active','instructions','questions']

class AnswerSubmissionSerializer(serializers.ModelSerializer):
    question = serializers.PrimaryKeyRelatedField(queryset=Question.objects.all())
    selected_choice = serializers.PrimaryKeyRelatedField(queryset=Choice.objects.all())

    class Meta:
        model = AnswerSubmission
        fields=['question','selected_choice']

class QuizSubmissionSerializer(serializers.ModelSerializer):
    answers = AnswerSubmissionSerializer(many=True, write_only=True)
    score = serializers.DecimalField(max_digits=5, decimal_places=2, read_only=True)

    class Meta:
        model = QuizSubmission
        fields = ['id', 'quiz', 'student', 'submitted_at', 'score', 'answers']
        read_only_fields = ['student', 'submitted_at', 'score']

    def create(self, validated_data):
        answers_data = validated_data.pop('answers')
        student = self.context['request'].user
        quiz = validated_data['quiz']

        submission = QuizSubmission.objects.create(student=student, quiz=quiz)

        correct_count = 0
        for ans in answers_data:
            question = ans['question']
            selected_choice = ans['selected_choice']
            AnswerSubmission.objects.create(
                submission=submission,
                question=question,
                selected_choice=selected_choice
            )
            if selected_choice.is_correct:
                correct_count += 1

        total_questions = quiz.questions.count()
        score = (correct_count / total_questions) * 100 if total_questions > 0 else 0
        submission.score = round(score, 2)
        submission.save()

        return submission  
    
class QuizProgressSerializer(serializers.ModelSerializer):
    quiz_title = serializers.CharField(source='quiz.title', read_only=True)

    class Meta:
        model = QuizSubmission
        fields = ['id', 'quiz_title', 'score', 'passed', 'submitted_at']