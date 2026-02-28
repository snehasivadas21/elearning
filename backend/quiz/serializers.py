from rest_framework import serializers
from .models import Quiz, Question, Option, UserQuizAttempt, UserAnswer


class OptionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Option
        fields = ["id", "text","is_correct"]

class StudentOptionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Option
        fields = ["id", "text"]

class QuestionSerializer(serializers.ModelSerializer):
    options = OptionSerializer(many=True)

    class Meta:
        model = Question
        fields = ["id", "text", "marks", "options"]

    def validate_options(self, value):
        if len(value) < 2:
            raise serializers.ValidationError(
                "At least 2 options required."
            )

        correct_count = sum(opt["is_correct"] for opt in value)

        if correct_count != 1:
            raise serializers.ValidationError(
                "Exactly one correct option required."
            )

        return value

    def create(self, validated_data):
        options_data = validated_data.pop("options")
        question = Question.objects.create(**validated_data)

        for option_data in options_data:
            Option.objects.create(
                question=question,
                **option_data
            )

        return question

    def update(self, instance, validated_data):
        options_data = validated_data.pop("options", None)

        instance.text = validated_data.get("text", instance.text)
        instance.marks = validated_data.get("marks", instance.marks)
        instance.save()

        if options_data:
            instance.options.all().delete()

            for option_data in options_data:
                Option.objects.create(
                    question=instance,
                    **option_data
                )

        return instance

class QuizSerializer(serializers.ModelSerializer):
    questions = QuestionSerializer(many=True, required=False, read_only=True)

    class Meta:
        model = Quiz
        fields = [
            "id",
            "course",
            "title",
            "pass_percentage",
            "time_limit",
            "max_attempts",
            "questions",
        ]

class QuizSubmissionSerializer(serializers.Serializer):
    answers = serializers.ListField(
        child=serializers.DictField()
    )

class UserAnswerSerializer(serializers.ModelSerializer):
    question_text = serializers.CharField(source="question.text", read_only=True)
    selected_option_text = serializers.CharField(source="selected_option.text", read_only=True)

    class Meta:
        model = UserAnswer
        fields = [
            "question_text",
            "selected_option_text",
            "is_correct"
        ]

class AttemptDetailSerializer(serializers.ModelSerializer):
    user_email = serializers.CharField(source="user.email", read_only=True)
    answers = UserAnswerSerializer(many=True, read_only=True)

    class Meta:
        model = UserQuizAttempt
        fields = [
            "id",
            "user_email",
            "attempt_number",
            "score",
            "percentage",
            "is_passed",
            "completed_at",
            "answers"
        ]
