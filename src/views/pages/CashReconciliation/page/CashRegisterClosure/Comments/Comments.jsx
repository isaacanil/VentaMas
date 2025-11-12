import { Form, Input } from 'antd'
import styled from 'styled-components'

export const Comments = ({ icon, label, ...props }) => {
  return (
    <Container>
      <FormItemStyled
        label={label}
        colon={false}
        labelCol={{ span: 24 }}
        wrapperCol={{ span: 24 }}
      >

        <Input.TextArea
          label={label}
          placeholder='Escribe aquí ...'
          icon={icon}
          autoSize={{ minRows: 2, maxRows: 10 }}

          {...props}
        />
      </FormItemStyled>
    </Container>
  )
}
const Container = styled.div`
    padding: 0.4em 0.4em; 
    background-color: white;
    border-radius: 0.5em;
    border: var(--border-primary);

`
const FormItemStyled = styled(Form.Item)`
    margin: 0;
    flex: 1;
    display: flex;
    flex-direction: column;
    
    .ant-form-item-label {
        text-align: left;
        padding: 0;
        display: block;
        margin-bottom: 4px;
    }

    .ant-form-item-label > label {
        height: auto;
    }

    .ant-form-item-control {
        width: 100%;
    }
 `