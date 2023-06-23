import { DateTime } from "luxon";
import styled from "styled-components";
import { FormattedValue } from "../../../../../../templates/system/FormattedValue/FormattedValue";

export const DateSection = ({ date }) => {

    if(typeof date === 'string'){
        date = JSON.parse(date)
    }
    console.log(date)

    const currentDate = date;
   
    const formattedDate = date && currentDate.toLocaleString(DateTime.DATE_SHORT);
    const formattedTime = date && currentDate.toFormat('hh:mm a');

    return (
        date && (
            <Container>
                <DateContainer>
                    <span>
                        {formattedDate}
                    </span>
                    <span>
                        {formattedTime}
                    </span>
                </DateContainer>
            </Container>
        )
    )
}
const Container = styled.div`

//border-radius: var(--border-radius);
//background-color: var(--White);
//border: 1px solid rgba(0, 0, 0, 0.150);
//padding: 0.1em 0.6em;
//display: flex;
//align-items: center;
//align-content: center;
//justify-content: space-between;
`
const DateContainer = styled.div`
display: flex;
gap: 1em;
align-items: center;
grid-template-columns: 1fr 1fr;
flex-wrap: nowrap;
font-size: 14px;



`
