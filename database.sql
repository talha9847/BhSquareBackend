    CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(150) UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role VARCHAR(100) NOT NULL,
    role_id int,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );


    CREATE TABLE leads (
        id SERIAL PRIMARY KEY,
        customer_name VARCHAR(100) NOT NULL,
        contact_number VARCHAR(15) NOT NULL,
        site_visit_date DATE,
        source_id INTEGER,
        address TEXT,
        notes TEXT,
        status VARCHAR(20) DEFAULT 'pending',          -- pending, converted, delayed, cancelled
        installation_type VARCHAR(20) DEFAULT 'Residential', -- Residential, Commercial, Industrial

        panel_wattage NUMERIC(10,2),
        number_of_panels INTEGER,
        total_capacity NUMERIC(10,2) GENERATED ALWAYS AS (panel_wattage * number_of_panels) STORED,

        inverter_kw NUMERIC(10,2),                    -- inverter input in kilowatts
        number_of_inverters INTEGER,
        inverter_capacity NUMERIC(10,2) GENERATED ALWAYS AS (inverter_kw * number_of_inverters) STORED,

        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE lead_sources (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        commercial_commission DECIMAL(10,2) DEFAULT 0,
        residential_commission DECIMAL(10,2) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    INSERT INTO lead_sources (source_name) VALUES
    ('Google'),
    ('Facebook'),
    ('Website'),
    ('Referral'),
    ('Walk-in'),
    ('Instagram'),
    ('LinkedIn');


    CREATE TABLE lead_delays (
        id SERIAL PRIMARY KEY,
        lead_id INTEGER REFERENCES leads(id) ON DELETE CASCADE,
        next_visit_date DATE,
        note TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );


    CREATE TABLE stages (
        id SERIAL PRIMARY KEY,
        stage_name VARCHAR(50) NOT NULL UNIQUE,
        default_order INTEGER NOT NULL,
        description TEXT
    );


    INSERT INTO stages (id, stage_name, default_order, description) VALUES
    (1, 'Customer', 1, 'Lead converted to customer'),
    (2, 'Name Change', 2, 'Name change verification'),
    (3, 'Doc Collection', 3, 'Documents collection stage'),
    (4, 'Registration', 4, 'Customer registration stage'),
    (5, 'Loan', 5, 'Loan process stage'),
    (6, 'Kit Ready', 6, 'Kit ready stage'),
    (7, 'Dispatch', 7, 'Kit dispatched to customer'),
    (8, 'Fabrication', 8, 'Fabrication stage'),
    (9, 'Wiring', 9, 'Wiring stage'),
    (10, 'File Upload', 10, 'File upload stage'),
    (11, 'Inspection', 11, 'Inspection stage'),
    (12, 'Reedeem', 12, 'Reedem stage'),
    (13,'Disbursal',13, 'Disbursal Stage');



    CREATE TABLE customers (
        id SERIAL PRIMARY KEY,
        lead_id INTEGER UNIQUE NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
        status VARCHAR(20) DEFAULT 'pending',
        name_change VARCHAR(20) DEFAULT 'not_used'  -- not_used, required, changed, unchanged
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP

    );


    CREATE TABLE customer_stages (
        id SERIAL PRIMARY KEY,
        customer_id INTEGER REFERENCES customers(id) ON DELETE CASCADE,
        stage_id INTEGER REFERENCES stages(id) ON DELETE CASCADE,
        status VARCHAR(20) NOT NULL DEFAULT 'not_used', -- pending, done, not_used
        note TEXT,
        started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        completed_at TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );


    CREATE TABLE lead_cancellations (
        id SERIAL PRIMARY KEY,
        lead_id INTEGER UNIQUE REFERENCES leads(id) ON DELETE CASCADE,
        reason TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );



    CREATE TABLE customer_documents (
        id SERIAL PRIMARY KEY,
        customer_id INTEGER REFERENCES customers(id) ON DELETE CASCADE,
        consumer_number VARCHAR(50) UNIQUE NOT NULL,
        geo_coordinate VARCHAR(100),
        registration_number VARCHAR(50),
        sub_division VARCHAR(50),
        final_system_size VARCHAR(50),
        folder_id TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    ALTER TABLE customer_documents
    ADD COLUMN folder_id TEXT;


    CREATE TABLE customer_document_files (
        id SERIAL PRIMARY KEY,
        document_id INTEGER REFERENCES customer_documents(id) ON DELETE CASCADE,
        file_name VARCHAR(255) NOT NULL,
        file_url TEXT NOT NULL,
        is_got BOOLEAN DEFAULT TRUE
        uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );



    CREATE TABLE customer_registration (
        id SERIAL PRIMARY KEY,
        customer_id INTEGER UNIQUE REFERENCES customers(id),
        application_number VARCHAR(50) UNIQUE,
        registration_date DATE     -- ✅ new column
        agreement_date DATE,
        inverter_qty INTEGER,
        panel_qty INTEGER,
        status VARCHAR(20) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    );


    CREATE TABLE panel_serials (
        id SERIAL PRIMARY KEY,
        customer_id INTEGER REFERENCES customers(id) ON DELETE CASCADE,
        serial_number VARCHAR(100) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE inverter_serials (
        id SERIAL PRIMARY KEY,
        customer_id INTEGER REFERENCES customers(id) ON DELETE CASCADE,
        serial_number VARCHAR(100) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );


    CREATE TABLE dispatch (
        id SERIAL PRIMARY KEY,
        customer_id INTEGER REFERENCES customers(id) ON DELETE CASCADE,
        driver_name VARCHAR(255) NOT NULL,
        vehicle VARCHAR(100),
        delivered BOOLEAN DEFAULT FALSE,
        status VARCHAR(20) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    alter table dispatch add column driver_id int REFERENCES drivers(id) on DELETE CASCADE
    alter table dispatch add column car_id int REFERENCES cars(id) on DELETE CASCADE



    CREATE TABLE file_generation (
        id SERIAL PRIMARY KEY,
        registration_id INTEGER NOT NULL UNIQUE REFERENCES customer_registration(id) ON DELETE CASCADE,
        cs_no VARCHAR(50),
        beneficiary_name VARCHAR(255),
        beneficiary_address TEXT,
        consumer_contact VARCHAR(50),
        application_number VARCHAR(50),
        consumer_number VARCHAR(50),
        registration_date DATE,
        agreement_date DATE,
        geo_location VARCHAR(255),
        subdivision VARCHAR(255),
        panel_brand VARCHAR(100),
        panel_capacity NUMERIC(10,2),
        panel_quantity INTEGER,
        system_capacity NUMERIC(10,2),
        inverter_brand VARCHAR(100),
        inverter_capacity NUMERIC(10,2),
        generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        file_path TEXT
    )




    CREATE TABLE name_change (
        id INT PRIMARY KEY AUTO_INCREMENT,
        customer_id INT NOT NULL,
        document_name VARCHAR(255) NOT NULL,
        document_url VARCHAR(500),
        is_got BOOLEAN DEFAULT TRUE
        UNIQUE (customer_id, document_name),
        generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    );


    CREATE TABLE kit_ready (
        id SERIAL PRIMARY KEY,
        
        customer_id INT REFERENCES customers(id),
        
        -- Loan processing status:
        -- 'pending'         → not yet evaluated
        -- 'required'        → loan is needed
        -- 'completed'       → loan process finished
        -- 'not_applicable'  → loan not needed
        loan_status VARCHAR(20) CHECK (
            loan_status IN ('pending', 'required', 'completed', 'not_applicable')
        ),
        
        -- Overall record status:
        -- 'pending' → work in progress
        -- 'done'    → fully completed
        status VARCHAR(10) DEFAULT 'pending' CHECK (
            status IN ('pending', 'done')
        )

            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP

    );




    CREATE TABLE customer_loan (
        id SERIAL PRIMARY KEY,
        customer_id INT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
        bank_name VARCHAR(100) NOT NULL,
        is_applied BOOLEAN DEFAULT FALSE,
        estimated NUMERIC(12,2),
        loan_amount NUMERIC(12,2),
        interest_rate NUMERIC(5,2),
        bank_remarks TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );



    CREATE TABLE loan_docs (
        id SERIAL PRIMARY KEY,
        loan_id INT NOT NULL REFERENCES customer_loan(id) ON DELETE CASCADE,
        doc_name VARCHAR(255) NOT NULL,
        url TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT loan_doc_unique UNIQUE (loan_id, doc_name)
    );


    CREATE TABLE brands (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE inventory_table (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    brand_id INTEGER REFERENCES brands(id) ON DELETE SET NULL,
    category_id INT REFERENCES category(id) ON DELETE SET NULL
    qty INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    ALTER TABLE inventory_table
    ADD COLUMN category_id INT REFERENCES category(id) ON DELETE SET NULL;

    ALTER TABLE inventory_table
    ADD COLUMN tax NUMERIC(5,2) DEFAULT 0 CHECK (tax >= 0);
    ALTER TABLE inventory_table
    ADD COLUMN price NUMERIC(10,2) DEFAULT 0 CHECK (price >= 0);



    CREATE TABLE kit_items (
        id SERIAL PRIMARY KEY,

        kit_id INTEGER NOT NULL REFERENCES kit_ready(id) ON DELETE CASCADE,
        inventory_id INTEGER NOT NULL REFERENCES inventory_table(id) ON DELETE CASCADE,

        qty INTEGER NOT NULL CHECK (qty > 0),

        status VARCHAR(20) DEFAULT 'pending' CHECK (
            status IN ('pending', 'allocated')
        ),

        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

        UNIQUE (kit_id, inventory_id)
    );


    CREATE TABLE fabricator (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,   
        commercial_commission DECIMAL(10,2) DEFAULT 0,
        residential_commission DECIMAL(10,2) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );



    CREATE TABLE fabrication (
        id SERIAL PRIMARY KEY,

        customer_id INTEGER REFERENCES customers(id) ON DELETE CASCADE,
        fabricator_id INTEGER REFERENCES fabricator(id) ON DELETE SET NULL,

        unused_pipes INTEGER DEFAULT 0 CHECK (unused_pipes >= 0),

        status VARCHAR(20) DEFAULT 'pending',

        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );



    CREATE TABLE wiring (
        id SERIAL PRIMARY KEY,
        customer_id INTEGER UNIQUE REFERENCES customers(id) ON DELETE CASCADE,
        technician_id INTEGER REFERENCES technician(id) ON DELETE CASCADE,
        status VARCHAR(20) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    ALTER TABLE wiring
    ADD COLUMN inventory_status VARCHAR(20) DEFAULT 'pending';



    CREATE TABLE technician (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );


    CREATE TABLE wire_inventory (
        id SERIAL PRIMARY KEY,
        brand_name VARCHAR(100) NOT NULL,
        wire_type VARCHAR(50) NOT NULL,
        color VARCHAR(50) NOT NULL,
        gauge NUMERIC(5,2) NOT NULL,   -- e.g. 1.5, 2.5, 4.00
        stock INTEGER DEFAULT 0,    -- current quantity in inventory
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT unique_wire UNIQUE (brand_name, wire_type, color, gauge)
    )
    ALTER TABLE wire_inventory
    ADD COLUMN price NUMERIC(10,2) DEFAULT 0 CHECK (price >= 0),
    ADD COLUMN tax NUMERIC(5,2) DEFAULT 0 CHECK (tax >= 0);




    CREATE TABLE drivers (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        mobile VARCHAR(15) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE cars (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        number VARCHAR(50) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE wiring_items (
        id SERIAL PRIMARY KEY,
        wiring_id INTEGER REFERENCES wiring(id) ON DELETE CASCADE,
        wire_inventory_id INTEGER REFERENCES wire_inventory(id) ON DELETE CASCADE,
        qty INTEGER NOT NULL CHECK (qty > 0),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE (wiring_id, wire_inventory_id)
    )

    CREATE TABLE wiring_docs (
        id SERIAL PRIMARY KEY,
        wiring_id INTEGER REFERENCES wiring(id) ON DELETE CASCADE,
        doc_name VARCHAR(255) NOT NULL,
        doc_link TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE (wiring_id, doc_name)
    );



    CREATE TABLE final_stage (
        id SERIAL PRIMARY KEY,

        customer_id INTEGER NOT NULL
            REFERENCES customers(id) ON DELETE CASCADE,
    supervisor_id INTEGER REFERENCES supervisor(id),
        file_approved BOOLEAN DEFAULT FALSE,
        file_uploaded BOOLEAN DEFAULT FALSE,
        inspection BOOLEAN DEFAULT FALSE,
        redeem BOOLEAN DEFAULT FALSE,
        disbursal BOOLEAN DEFAULT FALSE,
        status varchar(20) default 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );


    CREATE TABLE pages (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100),
        url varchar(50)
    );
    INSERT INTO pages (name,url) VALUES
    ('name_change','namechange'),
    ('doc_collect','documentcollection'),
    ('loan_docs','loanstep');

    CREATE TABLE permission (
        id SERIAL PRIMARY KEY,
        source_id INTEGER,
        customer_id INTEGER REFERENCES customers(id),
        page_id INTEGER REFERENCES pages(id),
        is_permitted BOOLEAN DEFAULT TRUE
    );



    CREATE TABLE web_leads ( 
        id SERIAL PRIMARY KEY,

        name VARCHAR(100) NOT NULL,
        mobile VARCHAR(15) NOT NULL,
        address TEXT,

        status VARCHAR(20) DEFAULT 'pending',

        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );


    CREATE TABLE commission (
        id SERIAL PRIMARY KEY,
        customer_id INT REFERENCES customers(id),
        source_id INT REFERENCES lead_sources(id),
        total_kw DECIMAL(10,2),
        type VARCHAR(50), -- e.g. 'commercial' or 'residential'
        commission DECIMAL(10,2),
        status VARCHAR(50), -- e.g. 'pending', 'paid'
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );


    CREATE TABLE supervisor_commission (
        id SERIAL PRIMARY KEY,

        supervisor_id INT NOT NULL
            REFERENCES supervisor(id) ON DELETE CASCADE,

        customer_id INT
            REFERENCES customers(id) ON DELETE CASCADE,

        total_kw DECIMAL(10,2),

        type VARCHAR(50), -- 'commercial' or 'residential'

        commission DECIMAL(10,2),

        status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'paid'

        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );


    CREATE TABLE unused_inventory (
        id SERIAL PRIMARY KEY,

        customer_id INTEGER NOT NULL REFERENCES customers(id),
        kit_item_id INTEGER NOT NULL REFERENCES kit_items(id),
        inventory_id INTEGER NOT NULL REFERENCES inventory_table(id),

        unused_qty INTEGER NOT NULL DEFAULT 0 CHECK (unused_qty >= 0),

        status VARCHAR(20) NOT NULL DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );


    CREATE TABLE cost (
        id SERIAL PRIMARY KEY,

        customer_id INTEGER UNIQUE NOT NULL 
            REFERENCES customers(id) ON DELETE CASCADE,

        kit_cost NUMERIC(12,2) DEFAULT 0 CHECK (kit_cost >= 0),
        wire_cost NUMERIC(12,2) DEFAULT 0 CHECK (wire_cost >= 0),
        extra_cost NUMERIC(12,2) DEFAULT 0 CHECK (extra_cost >= 0),
        commission_cost NUMERIC(12,2) DEFAULT 0 CHECK (commission_cost >= 0),
        fabricator_commission NUMERIC(12,2) DEFAULT 0 CHECK (fabricator_commission >= 0),
        supervisor_commission NUMERIC(12,2) DEFAULT 0 CHECK (supervisor_commission >= 0),

        total_cost NUMERIC(12,2) 
            GENERATED ALWAYS AS (kit_cost + wire_cost + extra_cost) STORED,

        remarks TEXT,

        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE supervisor (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        commercial_commission DECIMAL(10,2) DEFAULT 0,
        residential_commission DECIMAL(10,2) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );



    CREATE TABLE fabricator_commission ( 
        id SERIAL PRIMARY KEY,

        customer_id INT UNIQUE
            REFERENCES customers(id) ON DELETE CASCADE,

        fabricator_id INT
            REFERENCES fabricator(id) ON DELETE CASCADE,

        total_kw DECIMAL(10,2),

        commission DECIMAL(10,2),

        status VARCHAR(50) DEFAULT 'pending', -- pending, approved, paid

        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );



    CREATE TABLE completion (
        id SERIAL PRIMARY KEY,

        customer_id INTEGER NOT NULL
            REFERENCES customers(id) ON DELETE CASCADE,

        lead_id INTEGER NOT NULL
            REFERENCES leads(id) ,

        days INTEGER DEFAULT 0 CHECK (days >= 0),

        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

CREATE TABLE backup (
    id SERIAL PRIMARY KEY,
    backup_datetime TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    file_url TEXT NOT NULL
); 
    TRUNCATE TABLE
    users,
    leads,
    lead_sources,
    lead_delays,
    customers,
    customer_stages,
    lead_cancellations,
    customer_documents,
    customer_document_files,
    customer_registration,
    panel_serials,
    inverter_serials,
    dispatch,
    file_generation,
    name_change,
    kit_ready,
    customer_loan,
    loan_docs,
    brands,
    kit_items,
    fabricator,
    fabrication,
    wiring,
    wire_inventory,
    drivers,
    cars,
    wiring_items,
    wiring_docs,
    final_stage,
    web_leads,
    commission,
    supervisor_commission,
    unused_inventory,
    cost,
    technician,
    supervisor,
    fabricator_commission,
    completion
    RESTART IDENTITY CASCADE;