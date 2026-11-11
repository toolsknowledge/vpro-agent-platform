
import os
from pathlib import Path

import litellm

from dotenv import load_dotenv

from ragas.llms import llm_factory
from ragas.embeddings.base import embedding_factory

from ragas.metrics.collections import (
    Faithfulness,
    ContextPrecisionWithoutReference,
    ContextRecall,
    AnswerRelevancy,
    AnswerCorrectness,
)


# Load backend/.env
BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / ".env")


AWS_REGION = os.getenv("AWS_REGION", "us-east-1")

CHAT_MODEL_ID = os.getenv(
    "BEDROCK_CHAT_MODEL_ID",
    "us.amazon.nova-2-lite-v1:0"
)

EMBEDDING_MODEL_ID = os.getenv(
    "BEDROCK_EMBEDDING_MODEL_ID",
    "amazon.titan-embed-text-v2:0"
)


def create_evaluation_models():
    """
    Configure modern RAGAS LLM and embedding interfaces
    using Amazon Bedrock through LiteLLM.
    """

    # LiteLLM uses these AWS region variables.
    os.environ["AWS_REGION_NAME"] = AWS_REGION
    os.environ["AWS_DEFAULT_REGION"] = AWS_REGION

    # RAGAS structured-output LLM
    ragas_llm = llm_factory(
        model=f"bedrock/{CHAT_MODEL_ID}",
        provider="litellm",
        client=litellm.acompletion,
        temperature=0
    )

    # RAGAS embedding model
    ragas_embeddings = embedding_factory(
        provider="litellm",
        model=f"bedrock/{EMBEDDING_MODEL_ID}"
    )

    return ragas_llm, ragas_embeddings


def create_evaluation_metrics():
    """
    Initialize RAGAS 0.4.3 collection metrics.
    """

    ragas_llm, ragas_embeddings = create_evaluation_models()

    metrics = {
        "faithfulness": Faithfulness(
            llm=ragas_llm
        ),

        "context_precision": ContextPrecisionWithoutReference(
            llm=ragas_llm
        ),

        "context_recall": ContextRecall(
            llm=ragas_llm
        ),

        "answer_relevancy": AnswerRelevancy(
            llm=ragas_llm,
            embeddings=ragas_embeddings
        ),

        "answer_correctness": AnswerCorrectness(
            llm=ragas_llm,
            embeddings=ragas_embeddings
        )
    }

    return metrics
