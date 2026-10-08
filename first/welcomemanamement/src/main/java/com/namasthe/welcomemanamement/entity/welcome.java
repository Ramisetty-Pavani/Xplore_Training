package com.namasthe.welcomemanamement.entity;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity 
@Table
public class welcome {
    @Id 
    @GeneratedValue

    private String id;
    private String name;
    private String email;

}
