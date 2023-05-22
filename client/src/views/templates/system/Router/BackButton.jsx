import { useNavigate } from "react-router-dom";

export const BackButton = () => {
    const navigate = useNavigate();
    const handleBack = () => {
        navigate(-1);
    };
    return (
        <Button
        variant="outlined"
        color="primary"
        onClick={handleBack}
        >
        <ArrowBackIosIcon />
        Back
        </Button>
    );
    }