export const isValidDate = (birthDate) => {
    const date = new Date(birthDate);

    if (isNaN(date.getTime())) {
        return false;
    }


    const [year, month, day] = birthDate.split("-").map(Number);


    if (month < 1 || month > 12) {
        return false;
    }

    const daysInMonth = new Date(year, month, 0).getDate(); 
    if (day < 1 || day > daysInMonth) {
        return false; 
    }


    if (date > new Date()) {
        return false; 
    }

    const inputDate = birthDate.split("-").join(""); 
    const dateString = date.toISOString().split("T")[0].replace(/-/g, "");

  
    if (inputDate !== dateString) {
        return false; 
    }

    return true; 
};