FROM python:3.7.9

WORKDIR /app

RUN pip3 install virtualenv

RUN virtualenv -p python3 venv && \
    . venv/bin/activate

COPY open-web-calendar/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY open-web-calendar ./

CMD [ "python3", "app.py" ]