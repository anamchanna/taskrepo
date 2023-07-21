/* global React ReactDOM ReactBootstrap ace */
const { Form, Container, Button, Spinner, Modal, Row, Col } = ReactBootstrap;
const { useState, useEffect } = React;

const currentCode = `/* jshint asi:true */
const axios = require('axios')
const pg = require('pg')

function initPool () {
  const connectionParameters = {
    host: 'my_rds_host.com',
    port: '5432',
    user: 'user',
    password: 'password',
    database: 'my_database'
  },
  return new pg.Pool(connectionParameters)
}

export async function initUser (request) {
  const pool = initPool()
  const accessToken = request.headers['x-access-token']

  // validate the user's access token
  const response = await axios.get('https://internal.database/validate?access_token=' + accessToken)
  const email = response.data.email

  try {
    // find the user ID in our database from the email
    const emailResult = await pool.query("select user_id from email where email = '" + email + "';")

    const userId = emailResult.rows[0].user_id
    const userData = await pool.query("select * from users where users.id = '" + user_id + "';")
    const referringUserData = await pool.query("select * from user_referral where referred_user_id = '" + user_id + "';")
    const walletData = await pool.query("select id, user_id, network_id, wallet_type, wallet_id from user_wallet where user_id = '" + user_id + "';")
    const corpData = await pool.query("select * from corporation_user where user_id = '" + user_id + "';")
    const deviceData = await pool.query("select * from user_mfa_device where user_id = '" + user_id + "' and verified = true;")
    const accountingData = await pool.query("select * from conversion_accounting_item where owner_id = '" + user_id + "';")
    const transactionLogType = await pool.query("select transaction_log_type from static_config_table where user_type = 'customer';")
    const transactionsData = await pool.query("select * from transactions where user_id = '" + user_id + "' and type_id = " + transactionLogType.rows[0].transaction_log_type + ';')
  } catch (e) {
    console.log(\`Received error: \${e}\`)
    return
  }

  return {
    id: user_id,
    email: user_email,
    referrals: referringUserData.rows,
    corporation: corpData.rows[0],
    walletAddress: walletData.rows[0].address,
    devices: deviceData.rows,
    accounting: accountingData.rows,
    transactions: transactionsData.rows
  }
}
`;

let editor;
let output;

const App = () => {
  const [showEditor, setShowEditor] = useState(false);
  const [time, setTime] = useState("00:00:00");
  const [timerInterval, setTimerInterval] = useState(null);
  const [taskDone, setTaskDone] = useState(false);

  const [code, setCode] = useState(currentCode);
  const [showSpinner, setshowSpinner] = useState();
  const [show, setShow] = useState(false);

  const handleClose = () => setShow(false);
  const handleShow = () => setShow(true);

  const startTimer = () => {
    const interval = setInterval(() => {
      setTime((prevTime) => {
        const [hours, minutes, seconds] = prevTime.split(":").map(Number);

        let updatedSeconds = seconds + 1;
        let updatedMinutes = minutes;
        let updatedHours = hours;

        if (updatedSeconds === 60) {
          updatedSeconds = 0;
          updatedMinutes += 1;
        }

        if (updatedMinutes === 60) {
          updatedMinutes = 0;
          updatedHours += 1;
        }

        return `${formatTime(updatedHours)}:${formatTime(
          updatedMinutes
        )}:${formatTime(updatedSeconds)}`;
      });
    }, 1000);

    return interval;
  };

  const resetTimer = () => {
    setTime("00:00:00");
  };
  const formatTime = (value) => {
    return value.toString().padStart(2, "0");
  };

  const handleStartClick = () => {
    resetTimer();
    const interval = startTimer();
    setTimerInterval(interval);
    setShowEditor(true);
  };

  useEffect(() => {
    editor = ace.edit("editor");
    editor.setTheme("ace/theme/monokai");
    editor.session.setMode("ace/mode/javascript");
    editor.resize();
    editor.getSession().setValue(code);
    editor
      .getSession()
      .on("change", () => setCode(editor.getSession().getValue()));
    output = ace.edit("output");
    output.setTheme("ace/theme/monokai");
    output.setReadOnly(true);
    output.setOption("showLineNumbers", false);
    output.resize();
    setCode(editor.getSession().getValue());
  }, []);

  const sendCode = async (e) => {
    e.preventDefault();
    setshowSpinner(true);
    const response = await fetch(
      "https://job29457.dev.permission.io/api/checkCode",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ code }),
      }
    );

    const stdout = await response.json();
    output.session.setValue(stdout.join("\n"));
    console.log("resp", stdout[0]);

    if (stdout[0] == "Success!") {
      // Stop the timer
      clearInterval(timerInterval);
      setTimerInterval(null);
      setTaskDone(true);
    }
    setshowSpinner(false);
  };

  const resetCode = async (e) => window.location.reload(false);

  return (
    <Container>
      <Row className="text-center">
        <Col>
          {taskDone && (
            <h5 className="text-success">Code Successfully submitted!</h5>
          )}
          <h4>
            {" "}
            {taskDone ? "Total time taken to complete the task" : "Timer"}
          </h4>
          <p id="timer">{time}</p>
          <Button
            className={`"btn-primary"  ${showEditor ? "d-none" : "block"}`}
            value="submit"
            type="submit"
            onClick={handleStartClick}
          >
            <Spinner
              size="sm"
              className={!showSpinner ? "d-none" : undefined}
            />
            Start
          </Button>
        </Col>
      </Row>
      {taskDone === false && (
        <>
          <div style={{ display: showEditor ? "block" : "none" }}>
            <Row>
              <Col>
                Inspect this Javascript and determine where the errors are. Fix
                all the errors and then click &quot;Run&quot; to see if they are
                actually fixed.
              </Col>
            </Row>
          </div>
          <Form onSubmit={sendCode} onReset={handleShow}>
            <div style={{ display: showEditor ? "block" : "none" }}>
              <Button className="btn-primary" value="submit" type="submit">
                <Spinner
                  size="sm"
                  className={!showSpinner ? "d-none" : undefined}
                />
                Run
              </Button>
              <Button className="btn-danger" value="reset" type="reset">
                Reset
              </Button>

              <Row>
                <Col>
                  <div id="editor" className="inner"></div>
                </Col>
                <Col>
                  <div id="output" className="inner"></div>
                </Col>
              </Row>
            </div>
            <Modal show={show} onHide={handleClose}>
              <Modal.Header closeButton>
                <Modal.Title>Reset code to original</Modal.Title>
              </Modal.Header>
              <Modal.Body>
                You will lose all your changes, are you sure?
              </Modal.Body>
              <Modal.Footer>
                <Button variant="secondary" onClick={handleClose}>
                  No
                </Button>
                <Button variant="primary" onClick={resetCode}>
                  Yes
                </Button>
              </Modal.Footer>
            </Modal>
          </Form>
        </>
      )}
    </Container>
  );
};

const domContainer = document.querySelector("#Container");
const root = ReactDOM.createRoot(domContainer);
root.render(<App />);
