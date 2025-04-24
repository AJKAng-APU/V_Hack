from health_data import get_health_data, debug_all_sources, authorize,scan_raw_pressure,list_all_data_source_ids,write_test_blood_pressure,create_blood_pressure_datasource,run_all
from biorhythm_advice import generate_biorhythm_advice
from environment_advice import get_environment_health_advice

def check_data_source_list():
    creds = authorize("client_secret_312973657682-6p2qaf35702am9bh8drvullabafo30lh.apps.googleusercontent.com.json", "token.json")
    debug_all_sources(creds)

def check_raw_data_list():
    creds = authorize("client_secret_312973657682-6p2qaf35702am9bh8drvullabafo30lh.apps.googleusercontent.com.json", "token.json")
    scan_raw_pressure(creds)

def check_data_source_Id_list():
    creds = authorize("client_secret_312973657682-6p2qaf35702am9bh8drvullabafo30lh.apps.googleusercontent.com.json", "token.json")
    list_all_data_source_ids(creds)

def write_blood_pressure_data():
    creds = authorize("client_secret_312973657682-6p2qaf35702am9bh8drvullabafo30lh.apps.googleusercontent.com.json", "token.json")
    write_test_blood_pressure(creds, sbp=125, dbp=82)

def create_datasource():
    creds = authorize("client_secret_312973657682-xxx.json", "token.json")
    create_blood_pressure_datasource(creds)

def prediction():
    data = get_health_data(client_secret_filename="client_secret_312973657682-6p2qaf35702am9bh8drvullabafo30lh.apps.googleusercontent.com.json", fields=["pressure", "weight", "height", "glucose"])
    run_all(data)

def bio_advice(chronotype,medication_time):
    data = get_health_data(client_secret_filename="client_secret_312973657682-6p2qaf35702am9bh8drvullabafo30lh.apps.googleusercontent.com.json", fields=["pressure", "weight", "height", "glucose"])
    generate_biorhythm_advice(data,chronotype,medication_time)

def env_advice():
    get_environment_health_advice()

    
check_data_source_list()
check_raw_data_list()
check_data_source_Id_list()
create_datasource()
write_blood_pressure_data()
print(prediction())
print(bio_advice("Morning","08:00"))
print(get_health_data(client_secret_filename="client_secret_312973657682-6p2qaf35702am9bh8drvullabafo30lh.apps.googleusercontent.com.json",fields=["pressure"]))