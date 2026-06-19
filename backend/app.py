from flask import Flask, request, jsonify
from flask_cors import CORS
import snowflake.connector
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = Flask(__name__)

# CORS origins are configurable via .env; falls back to allow-all if not set
cors_origins = os.getenv('CORS_ORIGINS')
if cors_origins:
    CORS(app, origins=cors_origins.split(','))
else:
    CORS(app)

app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'dev-secret-key-change-in-production')

MAX_MESSAGE_LENGTH = int(os.getenv('MAX_MESSAGE_LENGTH', 500))


def get_snowflake_config():
    """
    Build the Snowflake connection config dynamically from any environment
    variable prefixed with SNOWFLAKE_. This means adding a new SNOWFLAKE_*
    variable to .env (e.g. SNOWFLAKE_ROLE, SNOWFLAKE_AUTHENTICATOR) is picked
    up automatically without editing this function.

    Example: SNOWFLAKE_ACCOUNT -> {'account': '...'}
             SNOWFLAKE_ROLE    -> {'role': '...'}
    """
    config = {}
    prefix = 'SNOWFLAKE_'
    for key, value in os.environ.items():
        if key.startswith(prefix) and value:
            param_name = key[len(prefix):].lower()
            config[param_name] = value
    return config


def get_snowflake_connection():
    """Establish connection to Snowflake using whatever SNOWFLAKE_* vars are set."""
    config = get_snowflake_config()
    if not config.get('account') or not config.get('user'):
        raise ValueError(
            "Missing required Snowflake configuration. "
            "Ensure SNOWFLAKE_ACCOUNT and SNOWFLAKE_USER are set in .env"
        )
    return snowflake.connector.connect(**config)


def query_snowflake(query, params=None):
    """
    Execute a query on Snowflake and return results as a list of dicts,
    keyed by column name. This means queries can return any number of
    columns and callers don't need to know column positions in advance.
    """
    conn = get_snowflake_connection()
    cursor = conn.cursor()
    try:
        if params:
            cursor.execute(query, params)
        else:
            cursor.execute(query)

        columns = [col[0] for col in cursor.description] if cursor.description else []
        rows = cursor.fetchall()
        results = [dict(zip(columns, row)) for row in rows]
        return results
    finally:
        cursor.close()
        conn.close()


def get_llm_response(user_query, context):
    """
    Placeholder LLM response generator.

    No LLM provider is wired up by default. To connect a real provider:
      1. Add the relevant API key to .env (see .env.example, e.g. GEMINI_API_KEY
         or OPENAI_API_KEY)
      2. Install the provider's SDK and add it to requirements.txt
      3. Replace the return statement below with an actual API call
    """
    return (
        f"I received your query: '{user_query}'. "
        f"Based on our database, I found some relevant information that might help."
    )


@app.route('/api/chat', methods=['POST'])
def chat():
    try:
        data = request.json
        user_message = data.get('message', '')

        if not user_message:
            return jsonify({'error': 'Message cannot be empty'}), 400

        if len(user_message) > MAX_MESSAGE_LENGTH:
            return jsonify({
                'error': f'Message exceeds maximum length of {MAX_MESSAGE_LENGTH} characters'
            }), 400

        # Query Snowflake for relevant information.
        # Results come back as a list of dicts, so any columns present in
        # chatbot_responses are accessible by name without changing this code.
        snowflake_query = """
        SELECT * FROM chatbot_responses
        WHERE question_keywords LIKE %s
        LIMIT 1
        """

        search_term = f"%{user_message[:20]}%"
        context = "No specific data found"

        try:
            results = query_snowflake(snowflake_query, (search_term,))
            if results:
                row = results[0]
                # Prefer a 'response_text' column if present, otherwise fall
                # back to the first available column value.
                context = row.get('RESPONSE_TEXT') or row.get('response_text') \
                    or next(iter(row.values()), context)
        except ValueError as config_error:
            # Snowflake isn't configured yet — degrade gracefully instead of failing the request
            print(f"Snowflake not configured: {config_error}")

        bot_response = get_llm_response(user_message, context)

        # Log the interaction in Snowflake, if configured
        try:
            log_query = """
            INSERT INTO chat_logs (user_message, bot_response, timestamp)
            VALUES (%s, %s, CURRENT_TIMESTAMP())
            """
            query_snowflake(log_query, (user_message, bot_response))
        except ValueError as config_error:
            print(f"Skipping chat log (Snowflake not configured): {config_error}")

        return jsonify({'response': bot_response})

    except Exception as e:
        print(f"Error processing chat message: {e}")
        return jsonify({'error': 'An error occurred processing your message'}), 500


if __name__ == '__main__':
    flask_host = os.getenv('FLASK_HOST', '0.0.0.0')
    flask_port = int(os.getenv('FLASK_PORT', 5000))
    flask_debug = os.getenv('FLASK_DEBUG', 'True').lower() == 'true'
    app.run(host=flask_host, port=flask_port, debug=flask_debug)